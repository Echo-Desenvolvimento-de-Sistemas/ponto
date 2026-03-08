<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConviteEmpresa extends Model
{
    protected $fillable = [
        'empresa_id',
        'token',
        'usado',
        'limite_usos',
        'expires_at',
    ];

    protected $casts = [
        'usado' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
