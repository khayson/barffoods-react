<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
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
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'size:2'],
            'zip_code' => ['required', 'string', 'regex:/^\d{5}(-\d{4})?$/'],
            'phone' => ['nullable', 'string', 'regex:/^[\d\s\-\(\)]+$/', 'max:20'],
            'is_default' => ['boolean'],
            'delivery_instructions' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'address_line1.required' => 'Street address is required.',
            'address_line1.max' => 'Street address cannot exceed 255 characters.',
            'city.required' => 'City is required.',
            'state.required' => 'State is required.',
            'state.size' => 'State must be a 2-letter code (e.g., CA, NY).',
            'zip_code.required' => 'ZIP code is required.',
            'zip_code.regex' => 'ZIP code must be in format 12345 or 12345-6789.',
            'phone.regex' => 'Phone number format is invalid.',
        ];
    }
}
