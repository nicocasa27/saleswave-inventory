
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

const UserRoles = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    deleteRole,
    addRole
  } = useUsersAndRoles(isAdmin);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUsers();
    console.log("UserRoles component mounted, fetching users...");
  }, [fetchUsers]);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      console.log("Manual refresh triggered");
      await fetchUsers();
      toast.success("Datos de usuarios actualizados correctamente");
    } catch (err) {
      console.error("Error during refresh:", err);
      toast.error("Error al actualizar datos de usuarios");
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log("Deleting role:", roleId);
      await deleteRole(roleId);
      // No necesitamos llamar a fetchUsers aquí porque ya lo hace deleteRole internamente
      // toast success también se maneja dentro de deleteRole
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles de Usuario</h1>
          <p className="text-muted-foreground">
            Gestione los permisos y roles de los usuarios del sistema.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      {error ? (
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          <p className="font-medium">Error al cargar los usuarios</p>
          <p className="text-sm">{typeof error === 'object' ? (error as Error).message : String(error)}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <UserRolesTable
          users={users} 
          loading={loading}
          onDeleteRole={handleDeleteRole}
          // No pasamos onAddRole porque no es una prop esperada por UserRolesTable
          onRefresh={handleRefresh}
        />
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Total de usuarios cargados: {users.length}
      </div>
    </div>
  );
};

export default UserRoles;
