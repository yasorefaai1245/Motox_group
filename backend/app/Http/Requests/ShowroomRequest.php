<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShowroomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT')
            || $this->isMethod('PATCH');

        $required = $isUpdate
            ? 'sometimes|required'
            : 'required';

        return [
            'city' => [$required, 'string', 'max:100'],
            'address' => [$required, 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'type' => [
                $required,
                Rule::in(['showroom', 'service_center']),
            ],
            'opening_hours' => [
                'sometimes', 'nullable', 'string', 'max:255',
            ],
            'image' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive']),
            ],
            'brand_ids' => [
                $isUpdate ? 'sometimes' : 'required',
                'array',
                'min:1',
            ],
            'brand_ids.*' => [
                'integer',
                'distinct',
                'exists:brands,id',
            ],
        ];
    }
}
