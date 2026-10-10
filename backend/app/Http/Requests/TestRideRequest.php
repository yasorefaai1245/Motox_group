<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TestRideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motorcycle_id' => [
                'required',
                'integer',
                'exists:motorcycles,id',
            ],
            'showroom_id' => [
                'required',
                'integer',
                'exists:showrooms,id',
            ],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'ride_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],
            'ride_time' => ['required', 'date_format:H:i'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
