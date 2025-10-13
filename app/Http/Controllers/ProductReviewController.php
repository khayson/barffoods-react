<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use App\Models\Product;
use App\Models\ReviewHelpfulVote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductReviewController extends Controller
{
    /**
     * Store a new review
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|numeric|exists:products,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'required|string|min:3|max:1000',
            ]);

            // Check if user already reviewed this product
            $existingReview = ProductReview::where('product_id', $request->product_id)
                ->where('user_id', Auth::id())
                ->first();

            if ($existingReview) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already reviewed this product.'
                ], 409);
            }

            $review = ProductReview::create([
                'product_id' => $request->product_id,
                'user_id' => Auth::id(),
                'rating' => $request->rating,
                'comment' => $request->comment,
                'is_approved' => true, // Auto-approve for now
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully!',
                'review' => $review->load('user')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while submitting the review: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing review
     */
    public function update(Request $request, $id)
    {
        $review = ProductReview::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'sometimes|string|min:10|max:1000',
        ]);

        $review->update($request->only(['rating', 'comment']));

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully!',
            'review' => $review->load('user')
        ]);
    }

    /**
     * Delete a review
     */
    public function destroy($id)
    {
        $review = ProductReview::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully!'
        ]);
    }

    /**
     * Toggle helpful status for a review
     */
    public function toggleHelpful(Request $request, $id)
    {
        $request->validate([
            'helpful' => 'required|boolean'
        ]);

        $review = ProductReview::findOrFail($id);
        $userId = Auth::id();
        
        return DB::transaction(function () use ($review, $userId, $request) {
            // Check if user already voted
            $existingVote = ReviewHelpfulVote::where('review_id', $review->id)
                ->where('user_id', $userId)
                ->first();

            if ($existingVote) {
                // Update existing vote
                $existingVote->update(['is_helpful' => $request->helpful]);
            } else {
                // Create new vote
                ReviewHelpfulVote::create([
                    'review_id' => $review->id,
                    'user_id' => $userId,
                    'is_helpful' => $request->helpful,
                ]);
            }

            // Get updated helpful count
            $helpfulCount = $review->helpful_count;

            return response()->json([
                'success' => true,
                'helpful_count' => $helpfulCount,
                'is_helpful' => $request->helpful
            ]);
        });
    }

    /**
     * Report a review
     */
    public function report(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'required|string|in:spam,inappropriate,offensive,other',
                'description' => 'nullable|string|max:500'
            ]);

            $review = ProductReview::findOrFail($id);

            // In a real app, you'd store this in a separate reports table
            // For now, we'll just log it
            \Log::info('Review reported', [
                'review_id' => $id,
                'reporter_id' => Auth::id(),
                'reason' => $request->reason,
                'description' => $request->description
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Review reported successfully. Thank you for your feedback.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $errorMessage = 'Validation failed: ';
            
            foreach ($errors as $field => $messages) {
                $errorMessage .= implode(', ', $messages) . ' ';
            }
            
            return response()->json([
                'success' => false,
                'message' => trim($errorMessage),
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reporting the review: ' . $e->getMessage()
            ], 500);
        }
    }
}