<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('jornada_trabalhos', function (Blueprint $table) {
            $table->enum('escala_tipo', ['regular', '12x36'])->default('regular')->after('tolerancia_minutos');
            $table->boolean('is_noturna')->default(false)->after('escala_tipo');
        });

        // Add config defaults to empresas if not present or as columns for query performance
        Schema::table('empresas', function (Blueprint $table) {
            $table->enum('regime_horas', ['banco', 'extra'])->default('extra')->after('cnpj');
            $table->integer('notificacao_ponto_minutos')->default(5)->after('regime_horas');
        });
    }

    public function down(): void
    {
        Schema::table('jornada_trabalhos', function (Blueprint $table) {
            $table->dropColumn(['escala_tipo', 'is_noturna']);
        });

        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['regime_horas', 'notificacao_ponto_minutos']);
        });
    }
};
