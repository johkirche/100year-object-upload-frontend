// Helper functions for file handling

/**
 * Determines the type of file based on the file data object
 */
export const getFileType = (fileData: any): 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other' => {
  if (!fileData) return 'other';
  
  // Extract MIME type from file data
  let mimeType = '';
  
  if (typeof fileData === 'object') {
    if (fileData.type) {
      mimeType = fileData.type;
    } else if (fileData.directus_files_id && typeof fileData.directus_files_id === 'object' && fileData.directus_files_id.type) {
      mimeType = fileData.directus_files_id.type;
    }
  }
  
  if (!mimeType) return 'other';
  
  // Determine file type based on MIME type
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.oasis.opendocument.text' ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }
  
  return 'other';
};

/**
 * Extracts the filename from the file data object
 */
export const getFileName = (fileData: any): string => {
  if (!fileData) return '';
  
  if (typeof fileData === 'object') {
    if (fileData.filename_download) {
      return fileData.filename_download;
    } else if (fileData.directus_files_id && typeof fileData.directus_files_id === 'object' && fileData.directus_files_id.filename_download) {
      return fileData.directus_files_id.filename_download;
    }
  }
  
  return 'Datei';
};

/**
 * Generates a thumbnail URL for the given file data
 */
export const getImageThumbnailUrl = (fileData: any, directusUrl: string, token: string, width = 150, height = 150) => {
  if (!fileData) return '';
  
  // Handle different possible formats of the file data
  let fileId: string | number | null = null;
  
  if (typeof fileData === 'object') {
    // Check for direct file object with id
    if (fileData.id && typeof fileData.filename_disk !== 'undefined') {
      fileId = fileData.id;
    } 
    // Check for junction table format with nested file object
    else if (fileData.directus_files_id && typeof fileData.directus_files_id === 'object' && fileData.directus_files_id.id) {
      fileId = fileData.directus_files_id.id;
    }
    // Check for junction table format (weitereAbbildungen)
    else if (fileData.directus_files_id) {
      fileId = fileData.directus_files_id;
    }
    // Check for normal object with id
    else if (fileData.id) {
      fileId = fileData.id;
    }
  } else {
    fileId = fileData;
  }
  
  if (!fileId) return '';
  
  // Remove trailing slash from directusUrl if present
  const normalizedDirectusUrl = directusUrl.endsWith('/') ? directusUrl.slice(0, -1) : directusUrl;
  
  // if width or height is 0, don't add them to the url 
  const widthParam = width > 0 ? `&width=${width}` : '';
  const heightParam = height > 0 ? `&height=${height}` : '';

  return `${normalizedDirectusUrl}/assets/${fileId}?${widthParam}${heightParam}&fit=cover&quality=80&access_token=${token}`;
};

/**
 * Generates a full asset URL for the given file data
 */
export const getAssetUrl = (fileData: any, directusUrl: string, token: string, download = false) => {
  if (!fileData) return '';
  
  // Handle different possible formats of the file data
  let fileId: string | number | null = null;
  
  if (typeof fileData === 'object') {
    // Check for direct file object with id
    if (fileData.id && typeof fileData.filename_disk !== 'undefined') {
      fileId = fileData.id;
    } 
    // Check for junction table format with nested file object
    else if (fileData.directus_files_id && typeof fileData.directus_files_id === 'object' && fileData.directus_files_id.id) {
      fileId = fileData.directus_files_id.id;
    }
    // Check for junction table format (weitereAbbildungen)
    else if (fileData.directus_files_id) {
      fileId = fileData.directus_files_id;
    } 
    // Check for normal object with id
    else if (fileData.id) {
      fileId = fileData.id;
    }
  } else {
    fileId = fileData;
  }
  
  if (!fileId) return '';
  
  // Remove trailing slash from directusUrl if present
  const normalizedDirectusUrl = directusUrl.endsWith('/') ? directusUrl.slice(0, -1) : directusUrl;
  
  return `${normalizedDirectusUrl}/assets/${fileId}${download ? '?download=true' : ''}${token ? `${download ? '&' : '?'}access_token=${token}` : ''}`;
}; 