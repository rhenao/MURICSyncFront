import {
  Avatar,
  Button,
  List,
  Menu,
  MenuItem,
  type MenuProps,
  alpha,
  styled,
} from "@mui/material";
import theme from "../theme.ts";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import PersonOutlineTwoToneIcon from "@mui/icons-material/PersonOutlineTwoTone";
import SettingsTwoToneIcon from "@mui/icons-material/SettingsTwoTone";
import Logout from "@mui/icons-material/Logout";
import UserAvatar from "./UserAvatar.tsx";
import { useNavigate } from "react-router-dom";
import useAuth from "../features/auth/hooks/useAuth";

const UserButton = styled(Button)(() => ({
  all: "inherit",
  cursor: "pointer",
  padding: 0,
  borderRadius: theme.shape.borderRadius,
  transition: "background-color 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "top",
      horizontal: "left",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "left",
    }}
    {...props}
  />
))(() => ({
  "& .MuiPaper-root": {
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
    color: theme.palette.text.primary,
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      minHeight: "auto",
      "& .MuiSvgIcon-root": {
        fontSize: 20,
        color: theme.palette.primary.main,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

export default function Userbox() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <List dense>
        <UserButton onClick={handleClick}>
          <Avatar
            sx={{
              display: { xs: "flex", md: "none" },
              borderRadius: theme.shape.borderRadius,
            }}
            alt="User"
            src=""
          />
          <UserAvatar />
        </UserButton>
      </List>
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <UserAvatar displaySmall={true} />
        <Divider variant="middle" sx={{ my: 1 }} />
        <MenuItem onClick={handleClose} disableRipple>
          <PersonOutlineTwoToneIcon color="primary" />
          Perfil
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
          <SettingsTwoToneIcon />
          Configuración
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} disableRipple>
          <Logout />
          Cerrar sesión
        </MenuItem>
      </StyledMenu>
    </>
  );
}
