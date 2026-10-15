document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load activities (${response.status})`);
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.appendChild(scheduleLabel);
        schedule.append(details.schedule);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        availability.className = "activity-availability";
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.appendChild(availabilityLabel);
        availability.append(`${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        if (details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;
            listItem.appendChild(participantEmail);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            removeButton.title = `Unregister ${participant}`;
            removeButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v7m6-7v7"/></svg>';
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(error.message || "Failed to unregister participant. Please try again.", "error");
                console.error("Error unregistering participant:", error);
                removeButton.disabled = false;
              }
            });
            listItem.appendChild(removeButton);
            participantsList.appendChild(listItem);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        }
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
