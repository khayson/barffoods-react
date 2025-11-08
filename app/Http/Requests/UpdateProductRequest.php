<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'super_admin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $productId = $this->route('id') ?? $this->route('product');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'price' => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
            'stock_quantity' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'store_id' => ['sometimes', 'integer', 'exists:stores,id'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($productId)],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'dimensions' => ['nullable', 'string', 'max:100'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.max' => 'Product name cannot exceed 255 characters.',
            'price.min' => 'Price must be at least 0.',
            'stock_quantity.min' => 'Stock quantity cannot be negative.',
            'category_id.exists' => 'The selected category is invalid.',
            'store_id.exists' => 'The selected store is invalid.',
            'sku.unique' => 'This SKU is already in use.',
            'images.max' => 'You can upload a maximum of 10 images.',
        ];
    }
}
