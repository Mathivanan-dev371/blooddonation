// In your Button click handler:
const onNotifyClick = async () => {
    try {
        await handleNotify(selectedUserId, "Alert", "We need your help!");
        alert("Sent!");
    } catch (err) {
        console.error(err);
    }
};