import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Header({ onAdmin }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          MCM
        </Typography>
        <MenuItem onClick={() => { handleClose(); }}>Modelos generados</MenuItem>
        <IconButton color="inherit" onClick={handleSettingsClick}>
          <SettingsIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={() => { handleClose(); onAdmin(); }}>Modelos</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
