<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EspelhoAssinatura extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'empresa_id',
        'mes',
        'ano',
        'hash_assinatura',
        'data_assinatura',
        'ip_address',
    ];

    protected $casts = [
        'data_assinatura' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
