# xstate
This directory contains all parts of the app that directly interact with the xstate library.  

## Contents
The directory contains common 'actions', 'guards' and 'events' that can be used by the state machines.
It also contains a svelte component that can be used to run the state machine with a state-mapped UI.

### Actions
* **handleSubmit:**  
  This action sets the submitted 'persistent' and 'volatile' data as the machine's new context and 
  then validates the values with the supplied 'zod' schema.
  The 'zod' schema can be generated in a synchronous callback. It has access to the machine's context.
  This way the schema can be generated dynamically based on previous input.
  Validation errors will be stored in the 'errors' property of the machine context.
  The property name is the key, the value is the error message.  
  **Note:** All submitted data will be set on the context, even if it is invalid by definition of the schema.

### Guards
* **isValidContext:**  
  Checks if the current context is valid by checking if the 'errors' context-property is empty.

### Events
* **Submit:**  
  This event sends new values for the 'persistent' and 'volatile' context fields to the machine.
  It is usually sent by a page that can modify a copy of the context. It sends the modified context back to the machine.
* **GoBack:**  
  This event is sent by a page that wants to go back to the previous page.
* **Cancel:**  
  This event is sent by a page that wants to stop the current process.

### Runtime components
* **StatePageMap:**  
  Maps a state to a page component. The component will be rendered when the machine is in the mapped state.
* **Flow:**  
  Wraps the state machine definition and the state->page map together and gives it an ID.
* **Context:**  
  An interface that defines the context of a compatible state machine. It is segmented into 'persistent' and 'volatile' 
  data blocks that are meant to be changed by a page as well as an 'errors' and 'data' section that are managed by the 
  state machine.
* **FlowWindow:**  
  A svelte component that can be used to run a flow. It uses an IPersistedFlowState to store the current state of the
  flow. The FlowWindow emits 'stateChanged' events when the state changes. 
  This can be used e.g. to react to the end of a flow e.g. by closing the window.
* **IPersistedFlowState:**  
  A persistence backend for the FlowWindow. It is used either pre-initialized (e.g. to realize a deeplink) or created 
  new for each flow invocation. The persistence is snapshot based and spans the flow's current 'state' and 
  the 'persisted' part of its context. The currently only implementation serializes the state to the url and 
  only keeps one snapshot. 
