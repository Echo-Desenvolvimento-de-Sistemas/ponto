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
            $table->time('intervalo_inicio')->nullable();
            $table->time('intervalo_fim')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('funcionario_detalhes', function (Blueprint $table) {
            $table->dropColumn(['intervalo_inicio', 'intervalo_fim']);
        });
    }
};
