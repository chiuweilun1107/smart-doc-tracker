
# Task-BE-006 & 007 Enhanced Plan: Flex Message Notifications

## Problem
The current `NotificationService` sends plain text messages. Users cannot interact (e.g., mark as done) without buttons.

## Solution
Upgrade `NotificationService.send_notification` to send a **Flex Message** instead of `TextSendMessage`.

### Flex Message Layout
- **Header**: "Task Due Soon" (Color coded by urgency)
- **Body**: 
    - Task Title (Bold)
    - Project Name
    - Due Date
    - Days Left
- **Footer**:
    - Button: "Mark as Completed" 
        - Action: `postback`
        - Data: `action=complete&task_id={event_id}`

## Implementation Steps
1.  **Modify `backend/services/notification.py`**:
    -   Import `FlexSendMessage`, `BubbleContainer`, etc.
    -   Create `create_deadline_flex_message` helper function.
    -   Replace `TextSendMessage` with `FlexSendMessage`.

## Verification
1.  Trigger a manual notification (via script or scheduling).
2.  Check Line on phone -> Should see a card with a button.
3.  Click "Mark as Completed".
4.  Bot should reply "Task marked as done".
