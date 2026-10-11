<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->isDataEntry()) {
            return false;
        }

        $service = $this->route('service');

        if ($service && !$service instanceof Service) {
            $service = Service::find($service);
        }

        if ($service && $service->brand_id === null) {
            return false;
        }

        if (
            $service &&
            !$user->brands()
                ->where('brands.id', $service->brand_id)
                ->exists()
        ) {
            return false;
        }

        $brandId = $this->input(
            'brand_id',
            $service?->brand_id
        );

        return $brandId !== null
            && $user->brands()
                ->where('brands.id', $brandId)
                ->exists();
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT')
            || $this->isMethod('PATCH');

        $required = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        return [
            'brand_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:brands,id',
            ],
            'name' => [
                ...$required,
                'string',
                'max:255',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'image' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000000',
            ],
            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }
}
