Initializing Archive App
---

---

**`Tasks:`**
> * Building prototype of the app ui.
> * Building the server and database stracure.
> * Bulding the api for the desktop app.
> * Using NAPS cli to scane document.
> * Adding an options to upload from the PC.

---
```More info: on adding new recored upload should go to the type of doc folder, this mean uploads folder will be multi depends on the types will be provides in the future.```

---
**`Buidling Prototype for the ui:`**
> * **Fields to add new record :**
>   * Search Box
>   * Doc Number
>   * Doc date
>   * Doc type: ['خطاب', 'تعميم']
> * Add new Record button
> * Header containe:
>   * User info
>   * Rule ['Adder', 'Viwer']
>   * Notification
> * Page to view status:
>   * disk size taken.
>   * last 3 recored add and by whom.
>   * other stuff in the futures.

---

**`Building the server and database stracure:`**

`More: adding new upload type in schema and using apollo upload.`
> * Server using apollo server.
> * prisma to manage local SqlLit database
> * Prisma Data Stracure:
>   * User @relation [Documents]
>   * Document @relation [User]
>   * Catagory @relation [Documetns]
> * **User Fields :**
>   * ID
>   * username
>   * first name
>   * lastname
>   * email
>   * Rule ['Adder', 'Viewer']
>   * password
>   * created_at
>   * updated_at
>   * Documents: [Document]
> * **Document Fields :**
>   * ID
>   * UserId @relaion UserId <-> Who add the recored 
>   * Content
>   * Date
>   * Type
>   * Numder
>   * Attachment [Documet or upload]
>   * File_path String <-> pointing to the path of upload on server folder/filename
>   * created_at
>   * updated_at
> * **Catagory Fields :**
>   * ID
>   * Name
>   * Documents [DocumentID]
>   * BgColor <-> new future to help reduce the styles in the app.

---

**`Bulding the server api for the desktop app:`**

> * Query api
>   * Search documents added by query [content, number, date] <-> pagining
>   * Get user info and rule.
>   * Get total documets.
>   * get last 3 documets for status page in the app.
>   * get documents of catagory aka "hashtag"

> * Resolvers api
>   * Register user
>   * User login
>   * Adding new document
>   * Updating document
>   * Deleteing document
>   * Updating user
>   * Deleting User


>**`Future: using naps2-6.1.2-setup to scan documents throw cli.`**