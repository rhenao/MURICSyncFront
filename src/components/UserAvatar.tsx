import theme from "../theme.ts";
import { Avatar, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import Typography from "@mui/material/Typography";
import useAuth from "../features/auth/hooks/useAuth";

export default function UserAvatar({
  displaySmall = false,
}: {
  displaySmall?: boolean;
}) {
  const { user } = useAuth();

  const displayName = user?.email || "Usuario";
  const fullName = user?.fullName || user?.firstName || "Nombre no disponible";

  return (
    <ListItem
      sx={{ display: displaySmall ? "flex" : { md: "flex", xs: "none" } }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{ borderRadius: theme.shape.borderRadius }}
          alt="User"
          src=""
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            fontSize={15}
            fontWeight={600}
            color={theme.palette.background.default}
          >
            {displayName}
          </Typography>
        }
        secondary={
          <Typography
            fontSize={12}
            fontWeight={100}
            color={theme.palette.background.paper}
          >
            {fullName}
          </Typography>
        }
      />
    </ListItem>
  );
}
