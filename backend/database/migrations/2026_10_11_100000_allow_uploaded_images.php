<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Allow images uploaded from the admin panel (stored as compressed
 * data URLs) as well as regular image links.
 */
return new class extends Migration
{
    private array $tables = ['brands', 'motorcycles', 'services', 'showrooms'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->longText('image')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->string('image')->nullable()->change();
            });
        }
    }
};
