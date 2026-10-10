<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motorcycle_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:motorcycles,id',
            ],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'type' => [
                'sometimes',
                'string',
                'max:50',
            ],
            'message' => ['required', 'string'],
        ];
    }
}
