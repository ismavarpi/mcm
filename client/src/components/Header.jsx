import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function Header({ appName, onAdmin, onModels, onHelp }) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {appName}
        </Typography>
        <MenuItem onClick={onModels}>Modelos</MenuItem>
        <IconButton color="inherit" onClick={onHelp}>
          <HelpOutlineIcon />
        </IconButton>
        <IconButton color="inherit" onClick={onAdmin}>
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
