<?php

namespace Randee\Menu;

final class MenuManager
{
    public function items(): array
    {
        return [
            ['label' => 'Products', 'href' => '/products'],
            ['label' => 'Packages', 'href' => '/packages'],
            ['label' => 'Releases', 'href' => '/releases'],
        ];
    }
}
