import { db } from "@/firebase/config";
import { collection, deleteDoc, getDocs } from "firebase/firestore";

const handleDeleteChats = async () => {
  if (confirm("Are you sure you want to delete all chats? This action cannot be undone.")) {
    try {
      const chatsRef = collection(db, `users/${currentUser.uid}/chats`);
      const querySnapshot = await getDocs(chatsRef);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setSuccess("All chats have been deleted.");
    } catch (error) {
      setError("Failed to delete chats. Please try again.");
      console.error("Failed to delete chats", error);
    }
  }
};