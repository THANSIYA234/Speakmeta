import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
  accentSoft?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = '#7C5CFF',
  accentSoft = '#EDE7FF',
}: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {icon && (
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: accentSoft,
                color: accent,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
              {label}
            </Typography>
          </Box>
        </Box>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block', fontWeight: 600 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
