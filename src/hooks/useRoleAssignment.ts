
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";

// Función helper para validar UUID
const isValidUUID = (uuid: string | null | undefined) => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const roleSchema = z.object({
  role: z.enum(["admin", "manager", "sales", "viewer"], {
    required_error: "Debes seleccionar un rol",
  }),
  store_id: z.string().optional(),
});

export function useRoleAssignment(
  selectedUser: UserWithRoles | null,
  stores: any[] = [],
  onSuccess: () => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "viewer",
      store_id: undefined,
    },
  });

  const currentRole = form.watch("role");
  
  // Determinar si el rol seleccionado necesita un almacén
  const needsStore = currentRole === "sales";
  
  // Si el rol necesita un almacén, validar que se haya seleccionado uno
  useEffect(() => {
    if (needsStore) {
      form.register("store_id", { required: "Debes seleccionar un almacén" });
    } else {
      form.unregister("store_id");
    }
  }, [needsStore, form]);

  const handleAddRole = async (values: z.infer<typeof roleSchema>) => {
    if (!selectedUser) {
      toast.error("No se puede asignar rol: usuario no seleccionado");
      return;
    }
    
    // Validación defensiva del ID de usuario
    if (!selectedUser.id || selectedUser.id === "null") {
      toast.error("No se puede asignar rol: ID de usuario inválido");
      console.error("ID de usuario inválido o es 'null':", selectedUser);
      return;
    }

    // Validación adicional del formato UUID
    if (!isValidUUID(selectedUser.id)) {
      toast.error("ID de usuario con formato inválido");
      console.error("ID de usuario con formato inválido:", selectedUser.id);
      return;
    }
    
    console.log("Asignando a:", selectedUser.id, "tipo:", typeof selectedUser.id);
    
    setIsSubmitting(true);
    
    try {
      console.log("Añadiendo rol:", values.role, "a usuario:", selectedUser.id);
      console.log("Usuario seleccionado:", selectedUser);
      console.log("Almacén seleccionado:", values.store_id || "Ninguno");
      
      // Verificar si el rol ya existe para este usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUser.id)
        .eq("role", values.role)
        .eq("almacen_id", values.store_id || null);
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        onSuccess();
        return;
      }
      
      // Insertar el nuevo rol - asegurarse que el user_id es un string válido
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: String(selectedUser.id), // Asegurar que sea un string
          role: values.role,
          almacen_id: values.store_id || null,
        });
        
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Rol asignado correctamente");
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
  };
}
