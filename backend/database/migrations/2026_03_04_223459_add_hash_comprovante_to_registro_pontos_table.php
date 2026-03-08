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
            $table->string('hash_comprovante')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registro_pontos', function (Blueprint $table) {
            $table->dropColumn('hash_comprovante');
        });
    }
};
