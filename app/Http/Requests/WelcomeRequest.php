<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WelcomeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Welcome page is public
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|integer|between:1,100',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'latitude.numeric' => 'Invalid latitude value',
            'latitude.between' => 'Latitude must be between -90 and 90',
            'longitude.numeric' => 'Invalid longitude value',
            'longitude.between' => 'Longitude must be between -180 and 180',
            'radius.integer' => 'Radius must be a whole number',
            'radius.between' => 'Radius must be between 1 and 100 miles',
        ];
    }
}
