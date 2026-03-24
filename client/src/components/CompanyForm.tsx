import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Company } from "@shared/types";

interface CompanyFormProps {
  company?: Company;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [name, setName] = useState(company?.name || "");
  const [description, setDescription] = useState(company?.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const createMutation = trpc.company.create.useMutation();
  const updateMutation = trpc.company.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      if (company) {
        await updateMutation.mutateAsync({
          id: company.id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Empresa atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Empresa criada com sucesso!");
      }

      setName("");
      setDescription("");
      onSuccess();
    } catch (error) {
      toast.error(company ? "Erro ao atualizar empresa" : "Erro ao criar empresa");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nome da Empresa *
        </label>
        <Input
          type="text"
          placeholder="Ex: Empresa XYZ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Descrição
        </label>
        <Textarea
          placeholder="Descrição da empresa (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isLoading ? (company ? "Salvando..." : "Criando...") : (company ? "Salvar Alterações" : "Criar Empresa")}
        </Button>
      </div>
    </form>
  );
}
