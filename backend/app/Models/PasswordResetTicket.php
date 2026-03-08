<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetTicket extends Model
{
    protected $fillable = [
        'email',
        'nome_empresa',
        'mensagem',
        'status',
    ];
}
