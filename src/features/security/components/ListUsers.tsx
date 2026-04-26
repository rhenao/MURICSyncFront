import { useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, Card, Typography, Chip, Box } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import type { UserInfoDto } from "../models/UserInfoDto.ts";
import DialogResetPassword from "./DialogResetPassword";
import DialogRegisterUser from "./DialogRegisterUser";
import DialogUpdateUser from "./DialogUpdateUser";
import { useGetUsers } from "../hooks/useGetUsers.tsx";

export default function ListUsers() {
  const { entidades, cargando } = useGetUsers<UserInfoDto>("/auth/users");
  const [openCrearUserDialog, setOpenCrearUserDialog] = useState(false);
  const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfoDto | null>(null);
  const [editingUser, setEditingUser] = useState<UserInfoDto | null>(null);

  const handleAddUser = () => {
    setOpenCrearUserDialog(true);
  };

  const handleEditUser = (user: UserInfoDto) => {
    setEditingUser(user);
    setOpenEditUserDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditUserDialog(false);
    setEditingUser(null);
  };

  const handleResetPassword = (user: UserInfoDto) => {
    setSelectedUser(user);
    setOpenResetPasswordDialog(true);
  };

  const handleCloseResetPasswordDialog = () => {
    setOpenResetPasswordDialog(false);
    setSelectedUser(null);
  };

  const handlePasswordReset = (userId: string) => {
    console.log("Contraseña reseteada para usuario:", userId);
    // TODO: Mostrar notificación o recargar datos si es necesario
  };

  const columns: MRT_ColumnDef<UserInfoDto>[] = [
    {
      accessorKey: "email",
      header: "Usuario",
      size: 250,
    },
    {
      accessorKey: "fullName",
      header: "Nombre Completo",
      size: 250,
    },
    {
      accessorKey: "numDocument",
      header: "Documento",
      size: 150,
    },
    {
      accessorKey: "isActive",
      header: "Activo",
      size: 100,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<boolean>() ? "Sí" : "No"}
          size="small"
          color={cell.getValue<boolean>() ? "success" : "default"}
        />
      ),
    },
    {
      accessorKey: "roles",
      header: "Roles",
      size: 200,
      Cell: ({ row }) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {row.original.roles?.map((role, index) => (
            <Chip
              key={index}
              label={role}
              size="small"
              variant="outlined"
              color="primary"
            />
          ))}
        </div>
      ),
    },
    {
      header: "Acciones",
      Cell: ({ row }) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "nowrap",
          }}
        >
          <Button
            sx={{
              fontSize: "0.675rem",
              minWidth: 0,
              px: 1,
              backgroundColor: "primary.main",
            }}
            variant="contained"
            onClick={() => handleEditUser(row.original)}
          >
            Editar
          </Button>
          <Button
            sx={{
              fontSize: "0.675rem",
              minWidth: 0,
              px: 1,
              backgroundColor: "warning.main",
            }}
            variant="contained"
            color="warning"
            onClick={() => handleResetPassword(row.original)}
          >
            Asignar contraseña
          </Button>
        </div>
      ),
      size: 220,
    },
  ];

  return (
    <>
      <Card
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          boxSizing: "border-box",
          backgroundColor: "background.default",
          p: 2,
          minWidth: 0,
          maxWidth: "100vw",
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={entidades ?? []}
          getRowId={(row) => row.id}
          state={{ isLoading: cargando }}
          enableColumnActions={false}
          enableColumnFilters={false}
          enableSorting={true}
          enablePagination={false}
          muiTableProps={{
            size: "small",
          }}
          muiTableBodyRowProps={{ hover: true }}
          muiTableContainerProps={{
            sx: {
              width: "100%",
              flex: 1,
              minWidth: 0,
              maxWidth: "100vw",
              alignItems: "flex-start",
              backgroundColor: "background.paper",
              maxHeight: "65vh",
              overflowY: "auto",
              overflowX: "auto",
            },
          }}
          muiTablePaperProps={{
            sx: {
              width: "100%",
              flex: 1,
              minWidth: 0,
              maxWidth: "100vw",
              boxShadow: "none",
              backgroundColor: "background.paper",
            },
          }}
          muiTableHeadCellProps={{ sx: { fontSize: "1.15rem" } }}
          muiTableBodyCellProps={{ sx: { fontSize: "1.1rem" } }}
          renderTopToolbarCustomActions={() => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                pl: 2,
                pr: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Usuarios
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddUser}
                sx={{
                  fontSize: "0.875rem",
                  px: 2,
                  py: 1,
                }}
              >
                Agregar Usuario
              </Button>
            </Box>
          )}
        />
      </Card>

      {editingUser && (
        <DialogUpdateUser
          open={openEditUserDialog}
          onClose={handleCloseEditDialog}
          user={editingUser}
          onUserUpdated={() => window.location.reload()}
        />
      )}

      <DialogRegisterUser
        open={openCrearUserDialog}
        onClose={() => setOpenCrearUserDialog(false)}
        onUserCreated={() => window.location.reload()}
      />

      {selectedUser && (
        <DialogResetPassword
          open={openResetPasswordDialog}
          onClose={handleCloseResetPasswordDialog}
          user={selectedUser}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </>
  );
}
