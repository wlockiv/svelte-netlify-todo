<script>
  import { user } from "../store";
</script>

<h1>User Profile</h1>
<div class="profile-card">
  <p>Email: {$user.email}</p>
  <p>Name: {$user.name}</p>
</div>

<style>
  .profile-card {
    width: 75%;
    max-width: 400px;
    border: solid 1px #ccc;
    border-radius: 4px;
  }
</style>
