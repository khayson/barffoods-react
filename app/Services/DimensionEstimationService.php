<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DimensionEstimationService
{
    /**
     * Estimate product dimensions based on product details
     * 
     * Uses a hybrid approach:
     * 1. Rule-based estimation (always works, instant)
     * 2. AI enhancement with Google Gemini (optional, if API key provided)
     */
    public function estimate(array $productData): array
    {
        // Try to auto-parse weight from product name if not provided
        $estimatedWeight = null;
        $weightSource = null;
        
        if (empty($productData['weight']) && !empty($productData['name'])) {
            // First, try to parse weight from name (e.g., "2lb", "5kg")
            $estimatedWeight = $this->parseWeightFromName($productData['name']);
            if ($estimatedWeight) {
                $productData['weight'] = $estimatedWeight;
                $weightSource = 'parsed';
            } else {
                // If no weight in name, estimate typical weight based on product type
                $estimatedWeight = $this->estimateTypicalWeight($productData['name']);
                if ($estimatedWeight) {
                    $productData['weight'] = $estimatedWeight;
                    $weightSource = 'estimated';
                }
            }
        }

        // Try AI estimation first if API key is available
        if (config('services.gemini.api_key')) {
            Log::info('Attempting AI dimension estimation', ['product' => $productData['name']]);
            try {
                $aiEstimate = $this->estimateWithAI($productData);
                if ($aiEstimate) {
                    Log::info('AI estimation successful', ['dimensions' => $aiEstimate]);
                    return [
                        'success' => true,
                        'method' => 'ai',
                        'dimensions' => $aiEstimate,
                        'weight' => $estimatedWeight,
                        'weight_source' => $weightSource,
                        'confidence' => 'high',
                    ];
                } else {
                    Log::warning('AI estimation returned null, falling back to rules');
                }
            } catch (\Exception $e) {
                Log::error('AI dimension estimation failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // Fall through to rule-based estimation
            }
        } else {
            Log::info('No Gemini API key configured, using rule-based estimation');
        }

        // Fallback to rule-based estimation
        $ruleBasedEstimate = $this->estimateWithRules($productData);
        
        return [
            'success' => true,
            'method' => 'rules',
            'dimensions' => $ruleBasedEstimate,
            'weight' => $estimatedWeight,
            'weight_source' => $weightSource,
            'confidence' => 'medium',
        ];
    }

    /**
     * AI-powered estimation using Google Gemini (FREE tier)
     */
    private function estimateWithAI(array $productData): ?array
    {
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            Log::warning('Gemini API key is empty');
            return null;
        }

        // Prepare the prompt
        $prompt = $this->buildPrompt($productData);
        
        Log::info('Sending request to Gemini API', [
            'api_url' => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            'prompt_length' => strlen($prompt)
        ]);

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-goog-api-key' => $apiKey,
                ])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'maxOutputTokens' => 200,
                    ]
                ]);

            Log::info('Gemini API response received', [
                'status' => $response->status(),
                'successful' => $response->successful()
            ]);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('Gemini API response body', ['result' => $result]);
                
                $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
                
                if ($text) {
                    Log::info('Gemini AI returned text', ['text' => $text]);
                    $parsed = $this->parseAIResponse($text);
                    Log::info('Parsed AI response', ['parsed' => $parsed]);
                    return $parsed;
                } else {
                    Log::warning('No text found in Gemini response', ['result' => $result]);
                }
            } else {
                Log::error('Gemini API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Gemini API exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return null;
    }

    /**
     * Rule-based estimation (always works, no API needed)
     */
    private function estimateWithRules(array $productData): array
    {
        $name = strtolower($productData['name'] ?? '');
        $category = strtolower($productData['category'] ?? '');
        $weight = (float) ($productData['weight'] ?? 0);

        // First, check for specific product type keywords in the name
        $dimensions = $this->detectProductType($name, $weight);
        
        // If no specific type detected, fall back to category-based dimensions
        if (!$dimensions) {
            $dimensions = $this->getCategoryDimensions($category, $name);
        }

        // Apply weight-based scaling if weight is provided and not already scaled
        if ($weight > 0 && $dimensions) {
            $dimensions = $this->scaleByWeight($dimensions, $weight);
        }

        return $dimensions;
    }

    /**
     * Detect specific product type from name and return appropriate dimensions
     */
    private function detectProductType(string $name, float $weight): ?array
    {
        // Packaging type patterns (most specific first)
        $typePatterns = [
            // Kitchen/Cleaning Items
            'sponge' => ['length' => 10, 'width' => 7, 'height' => 3],
            'brush' => ['length' => 20, 'width' => 5, 'height' => 5],
            'towel' => ['length' => 30, 'width' => 20, 'height' => 3],
            'cloth' => ['length' => 25, 'width' => 20, 'height' => 2],
            
            // Containers & Packaging
            'bottle' => ['length' => 8, 'width' => 8, 'height' => 25],
            'jar' => ['length' => 10, 'width' => 10, 'height' => 15],
            'can' => ['length' => 8, 'width' => 8, 'height' => 12],
            'tube' => ['length' => 5, 'width' => 5, 'height' => 20],
            'bag' => ['length' => 25, 'width' => 20, 'height' => 8],
            'pouch' => ['length' => 15, 'width' => 12, 'height' => 5],
            'box' => ['length' => 20, 'width' => 15, 'height' => 15],
            'carton' => ['length' => 25, 'width' => 20, 'height' => 20],
            'pack' => ['length' => 20, 'width' => 15, 'height' => 10],
            'package' => ['length' => 20, 'width' => 15, 'height' => 10],
            
            // Meat & Protein Products
            'patties' => ['length' => 20, 'width' => 15, 'height' => 5],
            'patty' => ['length' => 15, 'width' => 15, 'height' => 3],
            'steak' => ['length' => 20, 'width' => 15, 'height' => 4],
            'chops' => ['length' => 22, 'width' => 18, 'height' => 5],
            'ground' => ['length' => 20, 'width' => 15, 'height' => 8],
            'minced' => ['length' => 20, 'width' => 15, 'height' => 8],
            'breast' => ['length' => 25, 'width' => 15, 'height' => 6],
            'thigh' => ['length' => 20, 'width' => 15, 'height' => 5],
            'wings' => ['length' => 25, 'width' => 20, 'height' => 8],
            'drumstick' => ['length' => 20, 'width' => 15, 'height' => 10],
            'ribs' => ['length' => 30, 'width' => 20, 'height' => 10],
            'roast' => ['length' => 25, 'width' => 20, 'height' => 12],
            'fillet' => ['length' => 25, 'width' => 10, 'height' => 5],
            'filet' => ['length' => 25, 'width' => 10, 'height' => 5],
            
            // Specific Animals/Proteins
            'beef' => ['length' => 22, 'width' => 18, 'height' => 6],
            'chicken' => ['length' => 25, 'width' => 18, 'height' => 8],
            'turkey' => ['length' => 30, 'width' => 25, 'height' => 10],
            'pork' => ['length' => 22, 'width' => 18, 'height' => 6],
            'lamb' => ['length' => 20, 'width' => 15, 'height' => 6],
            'fish' => ['length' => 25, 'width' => 12, 'height' => 5],
            'salmon' => ['length' => 30, 'width' => 12, 'height' => 5],
            'tuna' => ['length' => 20, 'width' => 20, 'height' => 8],
            'sardine' => ['length' => 15, 'width' => 10, 'height' => 5],
            'shrimp' => ['length' => 20, 'width' => 15, 'height' => 6],
            'prawn' => ['length' => 20, 'width' => 15, 'height' => 6],
            
            // Pet Food Specific
            'kibble' => ['length' => 30, 'width' => 20, 'height' => 35],
            'treats' => ['length' => 15, 'width' => 10, 'height' => 8],
            'chew' => ['length' => 20, 'width' => 5, 'height' => 3],
            'bone' => ['length' => 15, 'width' => 5, 'height' => 5],
            
            // Pet Accessories
            'bowl' => ['length' => 20, 'width' => 20, 'height' => 8],
            'dish' => ['length' => 20, 'width' => 20, 'height' => 6],
            'feeder' => ['length' => 25, 'width' => 20, 'height' => 15],
            'collar' => ['length' => 25, 'width' => 15, 'height' => 3],
            'leash' => ['length' => 30, 'width' => 5, 'height' => 3],
            'harness' => ['length' => 30, 'width' => 25, 'height' => 5],
            'toy' => ['length' => 15, 'width' => 10, 'height' => 8],
            
            // Supplements & Small Items
            'pill' => ['length' => 8, 'width' => 6, 'height' => 10],
            'tablet' => ['length' => 10, 'width' => 8, 'height' => 6],
            'capsule' => ['length' => 10, 'width' => 8, 'height' => 12],
            'powder' => ['length' => 12, 'width' => 12, 'height' => 15],
            'supplement' => ['length' => 12, 'width' => 8, 'height' => 15],
        ];

        // Check for matches in product name
        foreach ($typePatterns as $keyword => $dims) {
            if (str_contains($name, $keyword)) {
                // Scale based on weight if provided
                if ($weight > 0) {
                    return $this->scaleByWeight($dims, $weight);
                }
                return $dims;
            }
        }

        return null;
    }

    /**
     * Get category-based dimensions as fallback
     */
    private function getCategoryDimensions(string $category, string $name): array
    {
        $categoryDimensions = [
            // Pet Food Categories
            'raw pet food' => ['length' => 20, 'width' => 15, 'height' => 10],
            'dog food' => ['length' => 25, 'width' => 18, 'height' => 12],
            'cat food' => ['length' => 20, 'width' => 15, 'height' => 10],
            'pet treats' => ['length' => 15, 'width' => 10, 'height' => 8],
            'pet supplements' => ['length' => 12, 'width' => 8, 'height' => 6],
            'pet accessories' => ['length' => 20, 'width' => 15, 'height' => 10],
            
            // General Food Categories
            'meat' => ['length' => 25, 'width' => 20, 'height' => 5],
            'poultry' => ['length' => 30, 'width' => 25, 'height' => 8],
            'seafood' => ['length' => 25, 'width' => 20, 'height' => 6],
            'vegetables' => ['length' => 20, 'width' => 15, 'height' => 10],
            'fruits' => ['length' => 20, 'width' => 20, 'height' => 15],
            'dairy' => ['length' => 15, 'width' => 10, 'height' => 12],
            
            // Default based on product size hints
            'default' => ['length' => 20, 'width' => 15, 'height' => 10],
        ];

        // Find matching category
        foreach ($categoryDimensions as $key => $dims) {
            if (str_contains($category, $key) || str_contains($name, $key)) {
                return $dims;
            }
        }

        // If nothing matches, make educated guess based on name length/complexity
        if (strlen($name) < 10) {
            // Short names = likely small items
            return ['length' => 12, 'width' => 10, 'height' => 8];
        } elseif (str_contains($name, 'large') || str_contains($name, 'xl') || str_contains($name, 'bulk')) {
            // Large items
            return ['length' => 35, 'width' => 30, 'height' => 25];
        } elseif (str_contains($name, 'small') || str_contains($name, 'mini')) {
            // Small items
            return ['length' => 12, 'width' => 10, 'height' => 8];
        }

        return $categoryDimensions['default'];
    }

    /**
     * Scale dimensions based on weight
     */
    private function scaleByWeight(array $baseDimensions, float $weight): array
    {
        // Weight in oz - convert to kg for calculation
        $weightKg = $weight * 0.0283495;
        
        if ($weightKg < 0.2) {
            // Very small items (< 200g)
            $scale = 0.6;
        } elseif ($weightKg < 0.5) {
            // Small items (< 500g)
            $scale = 0.8;
        } elseif ($weightKg > 2) {
            // Large items (> 2kg)
            $scale = min(2.5, 1 + ($weightKg / 5));
        } else {
            // Standard items
            $scale = 1;
        }

        return [
            'length' => round($baseDimensions['length'] * $scale, 1),
            'width' => round($baseDimensions['width'] * $scale, 1),
            'height' => round($baseDimensions['height'] * $scale, 1),
        ];
    }

    /**
     * Estimate typical weight based on product type
     * Returns weight in oz (ounces)
     */
    private function estimateTypicalWeight(string $name): ?float
    {
        $name = strtolower($name);
        
        // Typical weights for common product types (in ounces)
        $typicalWeights = [
            // Kitchen/Cleaning Items
            'sponge' => 2,
            'brush' => 4,
            'towel' => 8,
            'cloth' => 3,
            
            // Small Containers
            'bottle' => 12,
            'jar' => 16,
            'can' => 14,
            'tube' => 6,
            
            // Packaging Types
            'pouch' => 8,
            'pack' => 16,
            'package' => 16,
            
            // Meat Products (typical retail portions)
            'patties' => 16, // ~1 lb pack
            'patty' => 4, // single patty
            'steak' => 12, // ~0.75 lb
            'chops' => 16, // ~1 lb
            'ground' => 16, // ~1 lb
            'minced' => 16, // ~1 lb
            'breast' => 12, // ~0.75 lb
            'thigh' => 10,
            'wings' => 24, // ~1.5 lb pack
            'drumstick' => 16,
            'ribs' => 32, // ~2 lb rack
            'roast' => 48, // ~3 lb
            'fillet' => 8,
            'filet' => 8,
            
            // Specific Proteins (typical packages)
            'beef' => 16,
            'chicken' => 24,
            'turkey' => 32,
            'pork' => 16,
            'lamb' => 16,
            'fish' => 12,
            'salmon' => 12,
            'tuna' => 16,
            'sardine' => 6,
            'shrimp' => 16,
            'prawn' => 16,
            
            // Pet Food Specific
            'kibble' => 160, // ~10 lb bag typical
            'treats' => 8,
            'chew' => 4,
            'bone' => 6,
            
            // Pet Accessories
            'bowl' => 8,
            'dish' => 6,
            'feeder' => 16,
            'collar' => 2,
            'leash' => 4,
            'harness' => 6,
            'toy' => 4,
            
            // Supplements & Small Items
            'pill' => 2,
            'tablet' => 3,
            'capsule' => 4,
            'powder' => 12,
            'supplement' => 8,
        ];
        
        // Check for size modifiers first
        $sizeMultiplier = 1;
        if (str_contains($name, 'large') || str_contains($name, 'xl')) {
            $sizeMultiplier = 1.5;
        } elseif (str_contains($name, 'small') || str_contains($name, 'mini')) {
            $sizeMultiplier = 0.6;
        } elseif (str_contains($name, 'jumbo') || str_contains($name, 'giant')) {
            $sizeMultiplier = 2;
        }
        
        // Check for packaging quantity indicators
        if (preg_match('/(\d+)\s*(?:pack|count|pc|pcs|pieces?)/', $name, $matches)) {
            $count = (int) $matches[1];
            if ($count > 1) {
                $sizeMultiplier *= min(3, $count * 0.8); // Scale up but with diminishing returns
            }
        }
        
        // Check for "bag" which typically means larger quantity
        if (str_contains($name, 'bag') && !str_contains($name, 'small')) {
            $sizeMultiplier *= 1.5;
        }
        
        // Find matching product type
        foreach ($typicalWeights as $keyword => $weight) {
            if (str_contains($name, $keyword)) {
                return round($weight * $sizeMultiplier, 2);
            }
        }
        
        // If no specific match, make educated guess based on category hints
        if (str_contains($name, 'food') || str_contains($name, 'meat') || str_contains($name, 'protein')) {
            return 16; // 1 lb default for food items
        } elseif (str_contains($name, 'snack') || str_contains($name, 'treat')) {
            return 8; // 0.5 lb for treats
        } elseif (str_contains($name, 'organic') || str_contains($name, 'raw')) {
            return 16; // 1 lb for organic/raw items
        }
        
        return null; // No estimate if we can't determine type
    }

    /**
     * Parse weight from product name
     * Returns weight in oz (ounces)
     */
    private function parseWeightFromName(string $name): ?float
    {
        $name = strtolower($name);
        
        // Patterns to match various weight formats
        $patterns = [
            // Pounds: 2lb, 2lbs, 2 lb, 2 lbs, 2.5lb, 2.5 lbs
            '/(\d+\.?\d*)\s*lbs?(?:\s|$|[^a-z])/' => 16, // 1 lb = 16 oz
            
            // Kilograms: 5kg, 5 kg, 5.5kg, 5.5 kg
            '/(\d+\.?\d*)\s*kgs?(?:\s|$|[^a-z])/' => 35.274, // 1 kg = 35.274 oz
            
            // Grams: 500g, 500 g, 500gr, 500 grams
            '/(\d+\.?\d*)\s*(?:g|gr|grams?)(?:\s|$|[^a-z])/' => 0.035274, // 1 g = 0.035274 oz
            
            // Ounces: 16oz, 16 oz, 16 ounces
            '/(\d+\.?\d*)\s*(?:oz|ounces?)(?:\s|$|[^a-z])/' => 1, // already in oz
            
            // Milligrams: 500mg, 500 mg
            '/(\d+\.?\d*)\s*mgs?(?:\s|$|[^a-z])/' => 0.000035274, // 1 mg = 0.000035274 oz
        ];
        
        foreach ($patterns as $pattern => $multiplier) {
            if (preg_match($pattern, $name, $matches)) {
                $value = (float) $matches[1];
                $weightInOz = $value * $multiplier;
                
                // Round to 2 decimal places
                return round($weightInOz, 2);
            }
        }
        
        return null;
    }

    /**
     * Build AI prompt for dimension estimation
     */
    private function buildPrompt(array $productData): string
    {
        $name = $productData['name'] ?? 'Unknown Product';
        $category = $productData['category'] ?? 'General';
        $weight = $productData['weight'] ?? 'Unknown';
        $description = $productData['description'] ?? 'No description';

        return <<<PROMPT
You are a shipping logistics expert. Estimate the package dimensions for this product.

Product Details:
- Name: {$name}
- Category: {$category}
- Weight: {$weight} kg
- Description: {$description}

Provide realistic shipping dimensions in centimeters (cm) for a standard shipping box.
Consider packaging material (adds ~2-3cm per side).

Respond ONLY with this exact format (no extra text):
Length: [number]cm
Width: [number]cm  
Height: [number]cm

Example response:
Length: 25cm
Width: 20cm
Height: 15cm
PROMPT;
    }

    /**
     * Generate product description using AI
     */
    public function generateDescription(array $productData): array
    {
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            return [
                'success' => false,
                'message' => 'AI not configured',
            ];
        }

        try {
            $prompt = $this->buildDescriptionPrompt($productData);
            
            Log::info('Generating product description with AI', ['product' => $productData['name']]);
            
            $response = Http::timeout(20)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-goog-api-key' => $apiKey,
                ])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7, // More creative for descriptions
                        'maxOutputTokens' => 500,
                    ]
                ]);

            if ($response->successful()) {
                $result = $response->json();
                $description = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
                
                if ($description) {
                    // Clean up the description
                    $description = trim($description);
                    $description = str_replace(['"', '**', '*'], '', $description);
                    
                    Log::info('AI description generated successfully');
                    
                    return [
                        'success' => true,
                        'description' => $description,
                    ];
                }
            } else {
                Log::error('AI description generation failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('AI description generation exception', [
                'error' => $e->getMessage()
            ]);
        }

        return [
            'success' => false,
            'message' => 'Failed to generate description',
        ];
    }

    /**
     * Build prompt for description generation
     */
    private function buildDescriptionPrompt(array $productData): string
    {
        $name = $productData['name'] ?? 'Product';
        $category = $productData['category'] ?? 'General';
        $existingDesc = $productData['description'] ?? '';
        $weight = $productData['weight'] ?? null;

        $prompt = "You are a professional product copywriter for an e-commerce store.\n\n";
        $prompt .= "Write a compelling, SEO-friendly product description for:\n\n";
        $prompt .= "Product Name: {$name}\n";
        $prompt .= "Category: {$category}\n";
        
        if ($weight) {
            $prompt .= "Weight: {$weight} oz\n";
        }
        
        if ($existingDesc) {
            $prompt .= "Current Description: {$existingDesc}\n\n";
            $prompt .= "Improve and expand this description.\n\n";
        }
        
        $prompt .= "\nRequirements:\n";
        $prompt .= "- Write 2-3 paragraphs (150-250 words)\n";
        $prompt .= "- Highlight key features and benefits\n";
        $prompt .= "- Use persuasive but natural language\n";
        $prompt .= "- Make it engaging and informative\n";
        $prompt .= "- Focus on quality, value, and user benefits\n";
        $prompt .= "- Do NOT use markdown, quotes, or special formatting\n";
        $prompt .= "- Write in plain text only\n\n";
        $prompt .= "Description:";

        return $prompt;
    }

    /**
     * Parse AI response into structured data
     */
    private function parseAIResponse(string $text): ?array
    {
        // Extract dimensions using regex
        preg_match('/Length:\s*(\d+\.?\d*)\s*cm/i', $text, $lengthMatch);
        preg_match('/Width:\s*(\d+\.?\d*)\s*cm/i', $text, $widthMatch);
        preg_match('/Height:\s*(\d+\.?\d*)\s*cm/i', $text, $heightMatch);

        if ($lengthMatch && $widthMatch && $heightMatch) {
            return [
                'length' => (float) $lengthMatch[1],
                'width' => (float) $widthMatch[1],
                'height' => (float) $heightMatch[1],
            ];
        }

        return null;
    }
}

