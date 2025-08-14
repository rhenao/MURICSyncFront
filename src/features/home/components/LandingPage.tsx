import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function LandingPage() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
    >
      <Typography variant="h3" gutterBottom textAlign="center"></Typography>
    </Box>
  );
}
