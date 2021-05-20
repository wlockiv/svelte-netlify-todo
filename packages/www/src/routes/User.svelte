<script>
  import { user } from "../store";
</script>

<h1>User Profile</h1>
<div class="profile-card">
  <p>Email: {$user.email}</p>
  <p>Name: {$user.name}</p>
</div>

<style>
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  .profile-card {
    width: 75%;
    max-width: 400px;
    border: solid 1px #ccc;
    border-radius: 4px;
  }
</style>
