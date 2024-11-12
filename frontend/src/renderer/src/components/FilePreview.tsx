import React from 'react';
import { Popover, Typography, Box } from '@mui/material';

// Helper function to render file preview based on type
const renderFilePreview = (file) => {
  if (!file) return null;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  switch (fileExtension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return <img src={URL.createObjectURL(file)} alt="File preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />;
    
    case 'pdf':
      return (
        <Box sx={{ width: 200, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography>PDF Preview (Not Available)</Typography>
        </Box>
      );
    
    case 'txt':
      return (
        <Box sx={{ width: 200, height: 200, overflowY: 'auto' }}>
          <Typography>{file.textContent}</Typography>
        </Box>
      );
    
    default:
      return <Typography>Preview not available for this file type</Typography>;
  }
};

const FilePreview = ({ open, anchorEl, onClose, file }) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2, minWidth: 900, minHeight: 900 }}>
        {file ? (
          <>
            <Typography variant="h6" gutterBottom>
              {file.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {file.size ? `Size: ${Math.round(file.size / 1024)} KB` : 'Size: Unknown'}
            </Typography>
            <Box sx={{ mb: 1 }}>
              {renderFilePreview(file)}
            </Box>
          </>
        ) : (
          <Typography>No file selected</Typography>
        )}
      </Box>
    </Popover>
  );
};

export default FilePreview;
