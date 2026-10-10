<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    { 
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@vantaromotors.test',
            'password' => Hash::make('Admin@12345'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Data Entry',
            'email' => 'dataentry@vantaromotors.test',
            'password' => Hash::make('Data@12345'),
            'role' => 'data_entry',
        ]);
    }
}