<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('password_reset_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('nome_empresa')->nullable();
            $table->text('mensagem')->nullable();
            $table->enum('status', ['pendente', 'resolvido'])->default('pendente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tickets');
    }
};
