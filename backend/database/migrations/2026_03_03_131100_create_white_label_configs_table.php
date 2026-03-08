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
        Schema::create('white_label_configs', function (Blueprint $table) {
            $table->id();
            $table->string('empresa_id')->nullable(); // 'global' or tenant ID
            $table->string('systemName')->nullable();
            $table->string('primaryColor')->nullable();
            $table->string('logoUrl')->nullable();
            $table->string('loginBgUrl')->nullable();
            $table->timestamps();

            // se quiser unique por empresa
            $table->unique('empresa_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('white_label_configs');
    }
};
