#!/bin/bash
# Script para substituir console.log/error/warn por logger em todos os arquivos

echo "⚠️  IMPORTANTE: Este script faz substituições automáticas."
echo "⚠️  Revise as mudanças antes de commitar!"
echo ""
read -p "Continuar? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Função para adicionar import se necessário
add_import() {
    local file=$1
    if ! grep -q "from '@/utils/logger'" "$file"; then
        # Adiciona após o último import
        sed -i "/^import.*from/a import { logger } from '@/utils/logger'" "$file"
    fi
}

# Substitui console.log por logger.log
find src -type f \( -name "*.vue" -o -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/console\.log(/logger.log(/g' {} +

# Substitui console.error por logger.error  
find src -type f \( -name "*.vue" -o -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/console\.error(/logger.error(/g' {} +

# Substitui console.warn por logger.warn
find src -type f \( -name "*.vue" -o -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/console\.warn(/logger.warn(/g' {} +

# Adiciona imports necessários (para arquivos .vue e .ts)
for file in $(find src -type f \( -name "*.vue" -o -name "*.ts" \) -not -path "*/node_modules/*" | xargs grep -l "logger\.\(log\|error\|warn\)"); do
    add_import "$file"
done

echo "✅ Substituições concluídas!"
echo "📝 Revise os arquivos modificados antes de commitar."

