export interface TicketData {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    full_name: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
  tags: {
    tag: {
      id: string;
      name: string;
      type_id: string;
      tag_type: {
        name: string;
      }
    }
  }[];
  metadata: {
    id: string;
    field_type: {
      id: string;
      name: string;
      value_type: string;
    };
    field_value_text: string | null;
    field_value_int: number | null;
    field_value_float: number | null;
    field_value_bool: boolean | null;
    field_value_date: string | null;
    field_value_timestamp: string | null;
    field_value_user: { id: string; full_name: string } | null;
    field_value_ticket: { id: string; title: string } | null;
  }[];
} 