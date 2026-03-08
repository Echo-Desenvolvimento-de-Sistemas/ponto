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
        Schema::create('registro_pontos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('tipo', ['entrada', 'saida', 'inicio_intervalo', 'fim_intervalo']);
            $table->timestamp('horario_servidor')->useCurrent();
            $table->timestamp('horario_dispositivo')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_offline')->default(false);
            $table->boolean('is_out_of_bounds')->default(false);
            $table->enum('status', ['valido', 'alerta_geofence', 'rejeitado'])->default('valido');
            $table->string('hash_afd')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registro_pontos');
    }
};
