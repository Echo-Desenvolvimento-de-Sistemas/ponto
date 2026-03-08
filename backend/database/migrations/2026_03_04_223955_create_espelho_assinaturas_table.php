<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('espelho_assinaturas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('empresa_id')->constrained()->cascadeOnDelete();
            $table->integer('mes');
            $table->integer('ano');
            $table->string('hash_assinatura');
            $table->timestamp('data_assinatura');
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();

            // Um user só pode assinar 1 espelho por mes/ano
            $table->unique(['user_id', 'mes', 'ano']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('espelho_assinaturas');
    }
};
