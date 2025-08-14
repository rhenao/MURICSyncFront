import { Box } from "@mui/material";
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link
      to="/app"
      style={{
        textDecoration: "inherit",
        color: "inherit",
        lineHeight: 0,
      }}
    >
      <Box
        sx={{
          height: 80,
          minHeight: 80,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src="/logoTitulariceHor.png"
          alt="Shipping Dashboard Logo"
          width="15.6em"
          height="5.0em"
        />
      </Box>
    </Link>
  );
}
