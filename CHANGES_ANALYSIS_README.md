# Changes Analysis Integration

This document describes the integration of the changes analysis streaming API into the ChatbotView component.

## Overview

The changes analysis feature allows users to request modifications to their documents through natural language. The system analyzes the document content and suggests specific changes with explanations.

## API Integration

### API Endpoint
- **URL**: `https://api.getmediarank.com/api/v1/changes_analysis/changes_analysis_stream`
- **Method**: POST
- **Content-Type**: application/json

### Request Format
```json
{
  "messages": [
    {
      "content": "I want to update the payment terms from net 30 to net 45 days",
      "message_type": "text"
    }
  ],
  "pages": [
    {
      "page_number": 1,
      "page_content": "Document content here..."
    }
  ],
  "number_of_changes": 4
}
```

### Response Format
The API returns Server-Sent Events (SSE) with the following structure:

```
data: {"type": "change", "data": {"old_sentence": "...", "new_sentence": "...", "reason": "...", "page_number": 1}}
data: {"type": "complete", "total_changes": 4}
```

## Usage

### In ChatbotView

1. **Natural Language Requests**: Users can type requests like:
   - "Change the payment terms from net 30 to net 45 days"
   - "Update the contract duration from 12 months to 24 months"
   - "Modify the termination clause"

2. **Quick Action**: Click the "Suggest Changes" button in the quick actions section

3. **Automatic Detection**: The system automatically detects change requests based on keywords like:
   - change, update, modify, edit, replace, revise, amend

### Applying Changes

1. **Individual Changes**: Click "Apply" on any specific change
2. **All Changes**: Click "Apply All" to apply all suggested changes
3. **Integration**: Changes are applied using the existing `handleApplyChange` function

## Components

### Files Modified/Created

1. **`src/services/changesAnalysisApi.js`** (NEW)
   - API service for changes analysis
   - Streaming response handling
   - Fallback for testing when API is unavailable

2. **`src/components/DocumentPage/RightSidebar/ChatbotView.jsx`** (MODIFIED)
   - Added changes analysis functionality
   - Streaming UI updates
   - Suggested changes display
   - Apply changes integration

3. **`src/components/DocumentPage/RightSidebar/RightSidebar.jsx`** (MODIFIED)
   - Added `onApplyChanges` prop to ChatbotView

### Key Features

1. **Streaming Updates**: Real-time display of changes as they're received
2. **Visual Feedback**: Loading states and progress indicators
3. **Error Handling**: Graceful fallback when API is unavailable
4. **Integration**: Seamless integration with existing document editing system

## Testing

The system includes a fallback mechanism for testing when the API is not available. It will simulate the streaming response with sample changes.

## Error Handling

- Network errors are caught and handled gracefully
- API unavailability triggers fallback mode
- User-friendly error messages are displayed
- Console logging for debugging

## Future Enhancements

1. **Customization**: Allow users to specify the number of changes
2. **Batch Processing**: Support for multiple documents
3. **Change History**: Track applied changes
4. **Undo/Redo**: Support for reverting applied changes
5. **Advanced Filtering**: Filter changes by type or page

