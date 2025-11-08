<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'user_address_id' => ['required', 'integer', 'exists:user_addresses,id'],
            'delivery_slot_id' => ['nullable', 'integer', 'exists:delivery_slots,id'],
            'payment_method' => ['required', 'string', 'in:stripe,cash_on_delivery'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'items.*.store_id' => ['required', 'integer', 'exists:stores,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'user_address_id.required' => 'Please select a delivery address.',
            'user_address_id.exists' => 'The selected delivery address is invalid.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'Invalid payment method selected.',
            'items.required' => 'Your cart is empty.',
            'items.min' => 'Your cart must contain at least one item.',
            'items.*.product_id.exists' => 'One or more products in your cart are no longer available.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
            'items.*.quantity.max' => 'Quantity cannot exceed 100 per item.',
        ];
    }
}
