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
             Schema::create('test_rides', function (Blueprint $table) {
            $table->id();

            $table->foreignId('motorcycle_id')
                ->constrained('motorcycles')
                ->restrictOnDelete();

            $table->foreignId('showroom_id')
                ->constrained('showrooms')
                ->restrictOnDelete();

            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone', 50);

            $table->date('ride_date');
            $table->time('ride_time');

            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_rides');
    }
};
