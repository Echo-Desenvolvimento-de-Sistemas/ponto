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
        Schema::table('funcionario_detalhes', function (Blueprint $table) {
            $table->string('cargo')->nullable();
            $table->date('data_admissao')->nullable();
            $table->enum('regime_contratacao', ['CLT', 'PJ', 'Estágio', 'Temporário'])->default('CLT');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('funcionario_detalhes', function (Blueprint $table) {
            $table->dropColumn(['cargo', 'data_admissao', 'regime_contratacao']);
        });
    }
};
