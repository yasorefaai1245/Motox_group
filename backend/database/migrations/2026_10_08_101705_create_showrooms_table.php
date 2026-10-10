<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('showrooms', function (Blueprint $table) {
               $table->id();

            $table->string('city', 100);
            $table->string('address', 255);
            $table->string('phone', 50)->nullable();
            $table->string('type', 30)->default('showroom');
            $table->string('opening_hours', 255)->nullable();
            $table->string('image')->nullable();
            $table->string('status', 20)->default('active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('showrooms');
    }
};
