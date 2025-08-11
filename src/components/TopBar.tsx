import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  Box,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import theme from "../theme.ts";
import Userbox from "./UserBox.tsx";
//import Notifications from "./Notifications";

export default function Topbar({
  drawerWidth,
  handleDrawerToggle,
}: {
  drawerWidth: number;
  handleDrawerToggle: () => void;
}) {
  return (
    <AppBar
      position="fixed"
      sx={{
        ml: { lg: `${drawerWidth}px` },
        width: { lg: `calc(100% - ${drawerWidth}px)` },
        backgroundColor: theme.palette.primary.main,
        backdropFilter: "blur(5px)",
        boxShadow:
          "1px 2px 8px -3px rgba(34, 51, 84, 0.2), 10px 5px 22px -4px rgba(34, 51, 84, 0.1)",
      }}
    >
      <Toolbar>
        <Stack direction="row" alignItems="center" width="100%">
          {/* Espacio para el ícono de menú en xs, o placeholder invisible en lg */}
          <Box sx={{ width: 48, display: { xs: "block", lg: "none" } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { xs: "block", lg: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          {/* Banner centrado */}
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 2,
                color: theme.palette.common.white,
                textShadow: "0 1px 4px rgba(0,0,0,0.12)",
                textAlign: "center",
                userSelect: "none",
                fontSize: { xs: "1.2rem", lg: "1.5rem" },
              }}
            >
              MURIC Sync
            </Typography>
          </Box>
          <Userbox />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
