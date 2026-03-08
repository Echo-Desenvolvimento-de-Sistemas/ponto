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
        Schema::table('registro_pontos', function (Blueprint $table) {
            $table->text('justificativa')->nullable();
            $table->string('status_justificativa')->nullable(); // 'pendente', 'aprovada', 'rejeitada'
            $table->text('nota_empresa')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registro_pontos', function (Blueprint $table) {
            $table->dropColumn(['justificativa', 'status_justificativa', 'nota_empresa']);
        });
    }
};
