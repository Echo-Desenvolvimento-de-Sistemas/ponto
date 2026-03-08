<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'user_id',
        'acao',
        'model_type',
        'model_id',
        'dados_antigos',
        'dados_novos',
        'ip_address'
    ];

    protected $casts = [
        'dados_antigos' => 'array',
        'dados_novos' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
