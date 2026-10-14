import type { ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";

interface ListaHeaderProps {
  title: string;
  count: number;
  slot?: ReactNode;
}

export default function ListaHeader({ title, count, slot }: ListaHeaderProps) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {slot}
        <Chip
          label={`${count} registros`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>
    </Box>
  );
}
